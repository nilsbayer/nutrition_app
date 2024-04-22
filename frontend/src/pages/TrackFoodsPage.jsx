import {useAuthUser} from 'react-auth-kit'
import { Link } from 'react-router-dom';
import React, { useState } from 'react'
import { user_vector } from '../App'
import { NavBar } from '../components/NavBar';

export function TrackFoodsPage () {
    // const auth = useAuthUser()
    // const user = auth()

    function getRandomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }

    for (let key in user_vector.value) {
        console.log(key)
        
        let randomChange = getRandomNumber(0.1, 0.8);

        user_vector.value[key] *= (1 - randomChange);
    }

    console.log("User vector", user_vector.value)

    return <>
        <h1>Track Foods</h1>
        <NavBar />
    </>
}