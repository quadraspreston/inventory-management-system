const loginSection = document.getElementById('loginSection');
const loginForm = document.getElementById('loginForm');



loginForm.addEventListener('submit',(event)=>{
    event.preventDefault();
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginErrorFeedback = document.getElementById('loginErrorFeedback');
    loginErrorFeedback.style.opacity = 0;
    setTimeout(async() =>{
        if(!loginEmail.validity.valid||!loginPassword.validity.valid)
    {   
        loginErrorFeedback.style.opacity = 1;
        loginErrorFeedback.textContent = 'Please fill in all fields with valid information.';
        return;
    }
        const loginData = {
            email: loginEmail.value.trim(),
            password: loginPassword.value.trim()
        };
        try{
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(loginData)
            });
            const result = await response.json();
            if(result.success)
            {
                alert("Login Success");
            }
            else {
                loginErrorFeedback.style.opacity = 1;
                loginErrorFeedback.textContent = 'Incorrect Email or Password.';
                
            }
        } catch(err)
        {
            alert('Request Failed. Please try again.'); 
            
        }
    },100);
});

