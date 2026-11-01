const registrationForm = document.getElementById('registrationForm');
const searchStudent = document.getElementById('searchStudent');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const courseInput = document.getElementById('course');
const dataSort = document.getElementById('dataSort');

const btnPaginationPrev = document.getElementById('btnPaginationPrev');
const btnPaginationNext = document.getElementById('btnPaginationNext');
const paginationLabel = document.getElementById('paginationLabel');
const totalPagesEl = document.getElementById('totalPages');
const currentPageEl = document.getElementById('currentPage');
const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');

let students = loadStudents();
let currentKeyword = '';
let editingEmail = null;
let currentSort = loadCurrentSort();
let currentPage = 1;
let totalPage = 0;
let itemsPerPage = loadItemsPerPage();

itemsPerPageSelect.value = itemsPerPage;
dataSort.value = currentSort;


function loadCurrentSort() {
    const savedCurrentSort = localStorage.getItem('currentSort');

    if (savedCurrentSort !== null) {
        return savedCurrentSort;
    } 

    return '';
}

function loadItemsPerPage() {
    const savedItemsPerPage = localStorage.getItem('itemsPerPage');

    if(savedItemsPerPage !== null) {
        return Number(savedItemsPerPage)
    } 
        
    return 5;
}

function loadStudents() {
    
    const savedStudents = localStorage.getItem('students');


    if(savedStudents === null) {
        return [];
    }

    

    try {
        const parsedStudents =  JSON.parse(savedStudents);

        if(!Array.isArray(parsedStudents)) {
            return [];
        }

        const allValid = parsedStudents.every(student => {
            return isValidStudent(student);
        })

        if(!allValid) {
            return [];
        }

        return parsedStudents
    } catch(error) {
        console.error('Failed to load students:', error);

        return [];
    }

    

}

function isValidStudent(student) {
    return (
        typeof student === 'object' && student !== null && 
        typeof student.fullName === 'string' &&
        typeof student.email === 'string' && 
        typeof student.phone === 'string' && 
        typeof student.course === 'string' 
    );
}

function saveStudents() {
    localStorage.setItem('students', 
        JSON.stringify(students)
    );
}

function normalizeEmail(email) {
    return email.trim().toLowerCase()
}

function isEmailRegistered(email, excludedEmail = null) {

    return students.some(student => {
        const sameEmail = 
            normalizeEmail(student.email) === normalizeEmail(email);

        const isExcluded = 
            excludedEmail !== null 
            && normalizeEmail(student.email) === normalizeEmail(excludedEmail);

        return sameEmail && !isExcluded; 
    });
}

function validateRegistration(data) {
    // validation
    const error = {};

    if(data.fullName.trim() === '') {
        error.fullName = 'Full name is required'
    }

    if(data.email.trim() === '') {
        error.email = 'Email is required';
    } else {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const status = pattern.test(data.email);

        if(!status) {
            error.email = 'Invalid email address';
        }
    }

    if(data.phone.trim() === '') {
        error.phone = 'Phone number is required';
    }

    if(data.course.trim() === '') {
        error.course = 'Please select a program';
    } 

    return error;
}

function renderStudents(studentData) {
    const studentList = document.getElementById('studentList');

    studentList.replaceChildren(); //menghapus seluruh child nodes

    // Show empty state when no students match
    if(studentData.length === 0) {
        const message = document.createElement('li');
        message.textContent = 'No students found.';
        studentList.appendChild(message);

        return;
    }


    // Show students list if students > 0
    studentData.forEach(student => {

        let li = document.createElement('li');
        li.textContent = `${student.fullName} - ${student.course} `;

        let btnEdit = document.createElement('button');
        btnEdit.textContent = 'Edit';

        let btnDelete = document.createElement('button');
        btnDelete.textContent = 'Delete';

        btnEdit.addEventListener('click', function() {
            editingEmail = student.email;
            fullNameInput.value = student.fullName;
            emailInput.value = student.email;
            phoneInput.value = student.phone;
            courseInput.value = student.course;

            submitButton.textContent = 'Update!'
            cancelEditButton.hidden = false;
        });

        btnDelete.addEventListener('click', function() {
            // cari index student
            const index = students.findIndex(item => {
                return item.email === student.email;
            });
            // hapus student
            if(index !== -1) {
                students.splice(index, 1);

                saveStudents();
            }

            if (editingEmail === student.email) {
                resetFormMode();
            }

            // renderenderStudents(r ulang
            renderStudents(getVisibleStudents());
        });

        li.appendChild(btnEdit);
        li.appendChild(btnDelete);
        studentList.appendChild(li);
    })

    

}

// fungsi untuk menentukan data yang tampil
function getVisibleStudents() {
    // return hasil filter
    const filteredStudentsByKeyword = students.filter(student => {
        return student.fullName.
            toLowerCase().
            includes(currentKeyword);
    })


    const studentCount = document.getElementById('studentCount');
    studentCount.textContent = `(${filteredStudentsByKeyword.length})`;

    const sortedStudents = [...filteredStudentsByKeyword];

    if(currentSort === 'name-asc') {
        sortedStudents.sort((a, b) => {
            return a.fullName.localeCompare(b.fullName);
        });
    } else if(currentSort === 'name-desc') {
        sortedStudents.sort((a, b) => {
            return b.fullName.localeCompare(a.fullName);
        });
    } else if(currentSort === 'course-asc') {
        sortedStudents.sort((a, b) => {
            let courseComparison = a.course.localeCompare(b.course);

            if (courseComparison === 0) {
                return a.fullName.localeCompare(b.fullName);
            } else {
                return courseComparison;
            }
        });
    } else if(currentSort === 'course-desc') {
        sortedStudents.sort((a, b) => {
            let courseComparison = b.course.localeCompare(a.course);

            if (courseComparison === 0) {
                return a.fullName.localeCompare(b.fullName);
            } else {
                return courseComparison;
            }
        });
    } 

    updatePaginationUI(sortedStudents);

    const paginatedStudents = getPaginatedStudents(sortedStudents);

    return paginatedStudents;
}

function getPaginatedStudents(data) {
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;

    const paginatedStudents = data.slice(startIndex, endIndex);

    return paginatedStudents;
}


function resetFormMode() {
    editingEmail = null;
    registrationForm.reset();
    submitButton.textContent = 'Register'
    cancelEditButton.hidden = true;
}

function getFormData() {
    return {
        fullName: fullNameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        course: courseInput.value
    }
}

function registerStudent(formData) {
    students.push(formData);
}

function updateStudent(formData) {
    // cara data yang akan diedit
    const studentToEdit = students.find(student => {
        return student.email === editingEmail; 
    });

    if (!studentToEdit) {
        return false;
    }

    // update properties
    studentToEdit.fullName = formData.fullName;
    studentToEdit.email = formData.email;
    studentToEdit.phone = formData.phone;
    studentToEdit.course = formData.course;

    return true;
}

function updatePaginationUI(studentsData = students) {
    
    totalPage = Math.ceil(studentsData.length / itemsPerPage);
    
    if(totalPage === 0) currentPage = 1;
        

    if(totalPage > 0 && currentPage > totalPage) {
        currentPage = totalPage;
    }

    if(totalPage === 0) {
        currentPageEl.textContent = 0;    
    } else {
        currentPageEl.textContent = currentPage;    
    }
    
    totalPagesEl.textContent = totalPage;    

    if(currentPage <= 1) {
        btnPaginationPrev.setAttribute('disabled', 'true')
    } else {
        btnPaginationPrev.removeAttribute('disabled')
    }

    if(currentPage >= totalPage) {
        btnPaginationNext.setAttribute('disabled', 'true')
    } else {
        btnPaginationNext.removeAttribute('disabled')
    }

    renderPageNumbers();
    
}

function renderPageNumbers() {
    const pageNumbers = document.getElementById('pageNumbers');

    pageNumbers.replaceChildren();
    
    let lastRenderedPage = null;
    if (totalPage > 1) {
        for(let page = 1; page <= totalPage; page++) {
            const shouldRender = page === 1 ||
                                page === totalPage || 
                                (page >= currentPage - 1 && page <= currentPage + 1);
            if(!shouldRender) {
                continue;
            } 
            
            if(lastRenderedPage !== null && (page - lastRenderedPage) > 1 ) {
                pageNumbers.append('...')
            }        

            const pageButton = createPageButton(page);

    
            pageNumbers.append(pageButton);
            lastRenderedPage = page;
        }
    }
}



function createPageButton(page) {
    const pageButton = document.createElement('button');

    pageButton.textContent = page;        

    if (page === currentPage) {
        pageButton.setAttribute('disabled', 'true');
        pageButton.classList.add('active');
    } 

    pageButton.addEventListener('click', function() {
        currentPage = page;
        renderStudents(getVisibleStudents());
    });

    
    return pageButton;
}

itemsPerPageSelect.addEventListener('change', function (e) {
    const value = Number(e.target.value);

    itemsPerPage = value;
    localStorage.setItem('itemsPerPage', value);

    currentPage = 1;
    renderStudents(getVisibleStudents());
});


cancelEditButton.addEventListener('click', function() {
    resetFormMode();
});

registrationForm.addEventListener('submit', function(e) {

    e.preventDefault();

    const formData = getFormData();

    
    const error = Object.values(validateRegistration(formData));
    const feedbackEl = document.getElementById('feedback');

    if(error.length > 0) {
        let str = '<ul>';

        error.forEach((err) => {
            str += `<li>${err}</li>`
        })

        str += '</ul>'

        feedbackEl.innerHTML = str;
    } else {

        if(editingEmail === null) {
            // Register Mode
            // cek duplikasi email terlebih dahulu
            if(isEmailRegistered(formData.email)) {
                feedbackEl.textContent = "Email already registered."

                return;
            }
            
            registerStudent(formData);
            saveStudents();
            feedbackEl.textContent = "Registration successful!"
        } else {
            // Editing Mode
            // cek duplikasi email terlebih dahulu
            if(isEmailRegistered(formData.email, editingEmail)) {
                feedbackEl.textContent = "Email already registered."

                return;
            }

            const update = updateStudent(formData);

            if(!update) {
                feedbackEl.textContent = 'Student not found.';
                return;
            }

            saveStudents();
            feedbackEl.textContent = 'Student updated successfully!';
        }

        resetFormMode()
        renderStudents(getVisibleStudents());
    }


})

searchStudent.addEventListener('input', function(e) {
    currentKeyword = e.target.value.toLowerCase();

    currentPage = 1;

    renderStudents(getVisibleStudents());
});

dataSort.addEventListener('change', function(e) {
    currentSort = e.target.value;
    localStorage.setItem('currentSort', currentSort);

    renderStudents(getVisibleStudents());
    
});

btnPaginationPrev.addEventListener('click', function(e) {
    if(currentPage === 1) {
        return;
    }

    
    currentPage -= 1;

    renderStudents(getVisibleStudents());
});

btnPaginationNext.addEventListener('click', function(e) {
    if(currentPage >= totalPage) {
        return;
    }

    currentPage += 1;

    renderStudents(getVisibleStudents());
});

renderStudents(getVisibleStudents());
