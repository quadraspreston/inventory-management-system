const signupSection = document.getElementById('signupSection');
const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const signupFullName = document.getElementById('signupFullName');
    const signupFullNameFeedback = document.getElementById('signupFullNameFeedback');
    const signupEmail = document.getElementById('signupEmail');
    const signupPassword = document.getElementById('signupPassword');
    const signupConfirmPassword = document.getElementById('signupConfirmPassword');
    const signupEmailFeedback = document.getElementById('signupEmailFeedback');
    const signupPasswordFeedback = document.getElementById('signupPasswordFeedback');
    const signupConfirmPasswordFeedback = document.getElementById('signupConfirmPasswordFeedback');
    signupFullNameFeedback.style.opacity = 0;
    signupEmailFeedback.style.opacity = 0;
    signupPasswordFeedback.style.opacity = 0;
    signupConfirmPasswordFeedback.style.opacity = 0;

    setTimeout(async() =>{
    let isError = false;
    if(!signupEmail.validity.valid)
    {   signupEmailFeedback.style.opacity = 1;
        signupEmailFeedback.textContent=signupEmail.validationMessage;
        signupEmail.classList.add('error');
        isError =true;
    }
    else {
        signupEmailFeedback.textContent='';
        signupEmail.classList.remove('error');
    }


    if(!signupPassword.validity.valid)
      { signupPasswordFeedback.style.opacity = 1; 
        signupPasswordFeedback.textContent=signupPassword.validationMessage;
        signupPassword.classList.add('error');
        isError = true;
      }
      else if(signupPassword.value.trim().length<8)
      { signupPasswordFeedback.style.opacity = 1;
        signupPasswordFeedback.textContent='Password must be atleast 8 characters long.';
        isError = true;
      }
      else {
        signupPasswordFeedback.textContent='';
        signupPassword.classList.remove('error');
      }


        if(!signupFullName.validity.valid){
        signupFullNameFeedback.style.opacity = 1;
        signupFullNameFeedback.textContent=signupFullName.validationMessage;
        signupFullName.classList.add('error');
        isError = true;
        }
        else {
            signupFullNameFeedback.textContent='';
            signupFullName.classList.remove('error');
        }


    if(signupConfirmPassword.value.trim()!=signupPassword.value.trim()){
        signupConfirmPasswordFeedback.style.opacity = 1;
        signupConfirmPasswordFeedback.textContent = 'Passwords do not match.';
        signupConfirmPassword.classList.add('error');
        isError = true;
    }
    else {
        signupConfirmPasswordFeedback.textContent='';
        signupConfirmPassword.classList.remove('error');
    }
    if(isError)
        return;
    
    const signupData = {
        name:signupFullName.value.trim(),
        email:signupEmail.value.trim(),
        password:signupPassword.value.trim()
    };
    
    try{
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(signupData)
        });
        const result = await response.json();
        if(result.emailExists)
        {
            signupEmailFeedback.style.opacity = 1;
            signupEmailFeedback.textContent = 'Email already exists.';
            signupEmail.classList.add('error');
        }
        if(result.success)
        {
            location.href="/products";
        }
    }catch(err){
        alert('Request Failed. Please try again.');
    }
    },100);
});