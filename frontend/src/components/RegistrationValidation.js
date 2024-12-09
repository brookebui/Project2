function Validation(values){
    let error = {}
    const pass_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/

    if(values.email === ""){
        error.email = "Email is required"
    } else{
        error.email = ""
    }

    if(values.firstname === ""){
        error.firstname = "First name is required"
    } else{
        error.firstname = ""
    }

    if(values.lastname === ""){
        error.lastname = "Last name is required"
    } else{
        error.lastname = ""
    }

    if(values.address === ""){
        error.address = "Address is required"
    } else{
        error.address = ""
    }

    if(values.creditCard === ""){
        error.creditCard = "Credit card is required"
    } else{
        error.phoneNumber = ""
    }

    if(values.phoneNumber === ""){
        error.phoneNumber = "Phone number is required"
    } else{
        error.phoneNumber = ""
    }

    if(values.password === ""){
        error.password = "Password is required"
    } else if(!pass_pattern.test(values.password)){
        error.password = "Password is invalid"
    } else{
        error.password = ""
    }
    return error;
}

export default Validation;