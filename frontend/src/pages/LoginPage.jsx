import { Link, useParams } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid';
import { useSignIn } from 'react-auth-kit'

export function LoginPage() {
    const pwdInput = useRef()
    const emailInput = useRef()
    const signIn = useSignIn()
    const params = useParams()

    function handleSubmit (e) {
        e.preventDefault()
        // const loginData = new FormData()
        // loginData.set("email", emailInput.current.value)
        // loginData.set("password", pwdInput.current.value)
        fetchData({
            "email": emailInput.current.value,
            "password": pwdInput.current.value
        })
        .then(res => {
            if (res.msg !== "success") {
                pwdInput.current.value = ""
                let errorMsg = document.createElement("span")
                errorMsg.style.color = "red"
                errorMsg.innerText = "Email or Password are invalid."
                document.querySelector(".login-window").append(errorMsg)
            }
            else if (res.msg === "success") {
                console.log(res.email)
                if(signIn(
                    {
                        token: res.token,
                        expiresIn: 604800,
                        tokenType: "Bearer",
                        authState: { email: res.email, name: res.name }
                    }
                )){
                    window.location.href = window.location.origin
                }else {
                    console.log("Login failed")
                }
            }
        })
    }

    async function fetchData (dataToSend) {
        const response = await fetch(window.location.origin+'/api/login', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSend)
        });
        const data = await response.json();
        return data;
    }

    return <>
        <h1>Login to your mismicros</h1>
        <form onSubmit={handleSubmit}>
            <input ref={emailInput} placeholder="yourname@something.com" type="text" name="email" />
            <input ref={pwdInput} placeholder="definitelynot123456" type="password" name="password" />
            <button type="submit">Login</button>
        </form>
    </>
}