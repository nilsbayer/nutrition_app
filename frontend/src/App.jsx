import { Route, Routes, Link } from "react-router-dom";
import { effect, signal } from "@preact/signals-react";
import "./styles.css"
import { Dashboard } from "./pages/Dashboard";
import { RequireAuth, useAuthUser, useSignOut } from 'react-auth-kit'
import { notfiyUser } from "./Notifcation"
import { TrackFoodsPage } from './pages/TrackFoodsPage'

export const currentPopUp = signal(null)

export const user_vector = signal({
    "vitamin b-12": 2.4,
    "vitamin a": 800.0,                     
    "vitamin b-6": 1500.0,                  
    "niacin": 15000.0,                      
    "riboflavin (vitamin b-2)": 1200.0,
    "thiamin (vitamin b-1)": 1150.0,
    "vitamin c (ascorbic acid)": 82500.0,   
    "sodium": 2000000.0,                    
    "potassium": 4100000.0,                 
    "phosphorus": 700000.0,                 
    "magnesium": 315000.0,                  
    "iron": 18000.0,                        
    "calcium": 1000000.0,                   
    "total_fiber": 25000000.0,              
    "vitamin e": 15000.0,                   
    "vitamin k": 105.0,
    "cholesterol": 300.0 
})

export const userRecommendationVector = {
    "vitamin b-12": 2.4,
    "vitamin a": 800.0,                     
    "vitamin b-6": 1500.0,                  
    "niacin": 15000.0,                      
    "riboflavin (vitamin b-2)": 1200.0,
    "thiamin (vitamin b-1)": 1150.0,
    "vitamin c (ascorbic acid)": 82500.0,   
    "sodium": 2000000.0,                    
    "potassium": 4100000.0,                 
    "phosphorus": 700000.0,                 
    "magnesium": 315000.0,                  
    "iron": 18000.0,                        
    "calcium": 1000000.0,                   
    "total_fiber": 25000000.0,              
    "vitamin e": 15000.0,                   
    "vitamin k": 105.0,
    "cholesterol": 300.0 
}

export function App() {
    // const auth = useAuthUser()

    // return <>
    //     <Routes>
    //         <Route path="/" element={
    //             <RequireAuth loginPath={'/login/en'}>
    //                 <Dashboard />
    //             </RequireAuth>
    //         } />
    //         <Route path="/account-settings" element={
    //             <RequireAuth loginPath={'/login/en'}>
    //                 <AccountPage />
    //             </RequireAuth>
    //         } />
    //         <Route path="/edit-tour/:tourToken" element={
    //             <RequireAuth loginPath={'/login/en'}>
    //                 <TourEditor />
    //             </RequireAuth>
    //         } />
    //         <Route path="/tour-analytics/:tourToken" element={
    //             <RequireAuth loginPath={'/login/en'}>
    //                 <TourAnalyticsPage />
    //             </RequireAuth>
    //         } />
    //         <Route path="/tour-settings/:tourToken" element={
    //             <RequireAuth loginPath={'/login/en'}>
    //                 <TourSettingsPage />
    //             </RequireAuth>
    //         } />
    //         <Route path="/login/:lang" element={<LoginPage />} />
    //         {/* <Route exact path="/login" element={window.location.href = window.location.origin+"/login/en"} /> */}
    //     </Routes>
    // </>

    return <>
        <Routes>
            {/* <Route path="/login/:lang" element={<LoginPage />} /> */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/track-foods" element={<TrackFoodsPage />} />
        </Routes>
    </>
}