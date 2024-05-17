import {useAuthUser, useSignOut} from 'react-auth-kit'
import { NavBar } from '../components/NavBar';


export function SettingsPage() {
    const signOut = useSignOut()
    const auth = useAuthUser()
    const user = auth()

    return <>
        <div className="content-container">
            <h1>Settings</h1>
            <span className='prim-btn' onClick={(e) => {signOut(); window.location.href = window.location.origin+"/login"}}>Log out</span>
        </div>
        <NavBar />
    </>
}