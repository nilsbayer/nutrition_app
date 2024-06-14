import {useAuthUser} from 'react-auth-kit'
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react'
import { user_vector, userRecommendationVector } from '../App'
import { NavBar } from '../components/NavBar';
import { v4 as uuidv4 } from 'uuid';

export function RegisterPage() {
    return <>
        <h1>Create your own planty micros account</h1>
    </>
}