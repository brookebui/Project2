import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Validation from './RegistrationValidation';
import axios from 'axios';

function Registration() {
    const [values, setValues] = useState({
        firstname: '',
        lastname: '',
        address: '',
        phoneNumber: '',
        email: '',
        creditCard: '',
        password: '',
    });
    const navigate = useNavigate();

    const [errors, setErrors] = useState({});

    const handleInput = (event) => {
        setValues(prev => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const err = Validation(values);
        setErrors(err);

        if (!Object.values(err).some(error => error !== "")) {
            axios.post('http://localhost:5050/Registration', values)
                .then(response => {
                    if (response.data.success) {
                        navigate('/Login');
                    } else {
                        alert("Error creating account");
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert("Error creating account");
                });
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: '#98C1D9' }}>
            <div className='bg-white p-3 rounded w-25'>
                <h2>Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label htmlFor="email"><strong>Email</strong></label>
                        <input type="email" placeholder="Enter email" name='email' onChange={handleInput} className='form-control rounded-0' />
                        {errors.email && <span className='text-danger'> {errors.email}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor="firstname"><strong>First Name</strong></label>
                        <input type="text" placeholder="Enter first name" name='firstname' onChange={handleInput} className='form-control rounded-0' />
                        {errors.firstname && <span className='text-danger'> {errors.firstname}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor="lastname"><strong>Last Name</strong></label>
                        <input type="text" placeholder="Enter last name" name='lastname' onChange={handleInput} className='form-control rounded-0' />
                        {errors.lastname && <span className='text-danger'> {errors.lastname}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor="address"><strong>Address</strong></label>
                        <input type="text" placeholder="Enter address" name='address' onChange={handleInput} className='form-control rounded-0' />
                        {errors.address && <span className='text-danger'> {errors.address}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor="phoneNumber"><strong>Phone Number</strong></label>
                        <input type="text" placeholder="Enter phone number" name='phoneNumber' onChange={handleInput} className='form-control rounded-0' />
                        {errors.phoneNumber && <span className='text-danger'> {errors.phoneNumber}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor="creditCard"><strong>Credit Card</strong></label>
                        <input type="text" placeholder="Enter credit card" name='creditCard' onChange={handleInput} className='form-control rounded-0' />
                        {errors.creditCard && <span className='text-danger'> {errors.creditCard}</span>}
                    </div>
                    <div className='mb-3'>
                        <label htmlFor="password"><strong>Password</strong></label>
                        <input type="password" placeholder="Enter password" name='password' onChange={handleInput} className='form-control rounded-0' />
                        {errors.password && <span className='text-danger'> {errors.password}</span>}
                    </div>
                    <button type='submit' className='btn btn-success w-100 rounded-0'>Sign up</button>
                    <p></p>
                    <button 
                        type='button' 
                        className='btn btn-light border w-100 rounded-0' 
                        onClick={() => navigate('/')}>
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Registration;
