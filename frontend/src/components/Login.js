import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Validation from './LoginValidation'
import axios from 'axios'

function Login() {
    const [values, setValues] = useState({
        email: '',
        password: ''
    })
    const navigate = useNavigate();
    const [errors, setErrors] = useState({})

    const handleInput = (event) => {
        setValues(prev => ({...prev, [event.target.name]: event.target.value}))
    }

    const handleSubmit = (event) => {
        event.preventDefault();
    
        // Validate the form
        const err = Validation(values);
        setErrors(err);
    
        // If no validation errors
        if (err.email === "" && err.password === "") {
            // Make the API call to log in
            axios.post('http://localhost:5050/login', values)
            .then(response => {
                if (response.data.success) {
                    const { client_id, user } = response.data;

                    console.log("Client ID before storing in localStorage:", client_id);  // Debug log

                    // Store clientID in localStorage
                    localStorage.setItem('client_id', client_id);

                    // Optionally, store user data if needed
                    localStorage.setItem('username', user.first_name);  // Example: storing first name

                    // Navigate to the client dashboard
                    navigate('/ClientDashboard');
                } else {
                    alert("Invalid email or password");
                }
            })
            .catch(err => {
                console.log(err);
                alert("Invalid email or password");
            });


        }
    };
    

    const handleAccessAsDavid = () => {
        navigate('/DavidDashboard');
    };

    return(
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#98C1D9' }}>
            <div className='bg-white p-3 rounded w-25'>
                <h2>Login</h2>
                <form action="" onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label htmlFor="email"><strong>Email</strong></label>
                        <input 
                            type="email" 
                            placeholder="Enter Email" 
                            name='email'
                            onChange={handleInput} 
                            className='form-control rounded-0'
                        />
                        {errors.email && <span className='text-danger'>{errors.email}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor="password"><strong>Password</strong></label>
                        <input 
                            type="password" 
                            placeholder="Enter Password" 
                            name='password'
                            onChange={handleInput} 
                            className='form-control rounded-0'
                        />
                        {errors.password && <span className='text-danger'>{errors.password}</span>}
                    </div>
                    <button type='submit' className='btn btn-success w-100 rounded-0'>Log in</button>
                    <p></p>
                    <Link to="/Registration" className='btn btn-light border w-100 rounded-0'>Create Account</Link>
                </form>
                <button 
                    type='button' 
                    className='btn btn-primary w-100 rounded-0 mt-3' 
                    onClick={handleAccessAsDavid}
                >
                    Access as David
                </button>
            </div>
        </div>
    )
}

export default Login