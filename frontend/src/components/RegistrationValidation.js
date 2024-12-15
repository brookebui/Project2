function Validation(values){
    let error = {}
    const pass_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/

    if(values.email === ""){
        error.email = "Email is required"
    } else{
        error.email = ""
    }

    if(values.first_name === ""){
        error.first_name = "First name is required"
    } else{
        error.first_name = ""
    }

    if(values.last_name === ""){
        error.last_name = "Last name is required"
    } else{
        error.last_name = ""
    }

    if(values.address === ""){
        error.address = "Address is required"
    } else{
        error.address = ""
    }

    if(values.credit_card === ""){
        error.credit_card = "Credit card is required"
    } else{
        error.phone_number = ""
    }

    if(values.phone_number === ""){
        error.phone_number = "Phone number is required"
    } else{
        error.phone_number = ""
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