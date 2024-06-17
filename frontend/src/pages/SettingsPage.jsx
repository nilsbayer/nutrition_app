import {useAuthUser, useSignOut} from 'react-auth-kit'
import { NavBar } from '../components/NavBar';
import { useEffect, useState } from 'react';
import { notfiyUser } from '../Notifcation';


export function SettingsPage() {
    const signOut = useSignOut()
    const auth = useAuthUser()
    const user = auth()

    const [ loading, setLoading ] = useState(true)
    const [ userData, setUserData ] = useState(() => {
        fetchUserData()
        .then(data => {
            console.log(data)
            if (data.msg) {
                setUserData(data.user_data)
                setLoading(false)
            }
            else {
                notfiyUser("Your user data could not be loaded. Try again later or log out and in.")
            }
        })
    })

    async function fetchUserData() {
        const response = await fetch(window.location.origin+'/api/get-user-data', {
            method: "GET",
            credentials: "same-origin"
        })
        const data = await response.json();
        return data;
    }

    if (loading) {
        return <><div className="content-container settings-page">
            <h1>Settings</h1>
            <div>
                <span style={{fontWeight: "bolder"}}>Email</span>
                <p>
                    {user.email}
                </p>
            </div>
            <div>
                <span style={{fontWeight: "bolder"}}>Name</span>
                <p>
                    {user.name}
                </p>
            </div>

            <div>
                <span className='prim-btn' onClick={(e) => {signOut(); window.location.href = window.location.origin+"/login"}}>Log out</span>
            </div>
            <div className="loading-container">
                <div className="loading-circle"></div>
            </div>
        </div>
        <NavBar />
        </>
    }

    return <>
        <div className="content-container settings-page">
            <h1>Settings</h1>
            <div>
                <span style={{fontWeight: "bolder"}}>Email</span>
                <p>
                    {user.email}
                </p>
            </div>
            <div>
                <span style={{fontWeight: "bolder"}}>Name</span>
                <p>
                    {user.name}
                </p>
            </div>
            <div>
                <span style={{fontWeight: "bolder"}}>Sex</span>
                <p>
                    {userData.sex}
                </p>
            </div>
            <div>
                <span style={{fontWeight: "bolder"}}>Age</span>
                <p>
                    {userData.age} years
                </p>
            </div>
            <div>
                <span style={{fontWeight: "bolder"}}>Weight</span>
                <p>
                    {userData.weight} kg
                </p>
            </div>
            <div>
                <span style={{fontWeight: "bolder"}}>Account created</span>
                <p>
                    {userData.account_created}
                </p>
            </div>
            <div>
                <span className='prim-btn' onClick={(e) => {signOut(); window.location.href = window.location.origin+"/login"}}>Log out</span>
            </div>
            <div>
                <span className='prim-btn' onClick={(e) => {}}>Delete my account</span>
            </div>
        </div>
        <NavBar />
    </>
}