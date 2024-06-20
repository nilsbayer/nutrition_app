import { useState } from "react"
import { useAuthUser } from "react-auth-kit"
import { notfiyUser } from "../Notifcation"
import { Link } from "react-router-dom"

export function ReachOut () {
    const auth = useAuthUser()
    const user = auth()

    return <div className="shadow-box recipe-box">
        <div className="recipe-header" id="consulting-header">
            <h3>Book professional consultation</h3>
        </div> 
        <div style={{display: "flex", flexDirection: "column"}}>
            <div style={{display:"flex", flexDirection: "row", gap: "1rem", padding: "1rem", justifyContent:"space-around", alignItems:"center"}}>
                <span style={{fontSize: ".8rem"}}>Nils Bayer</span>
                <span style={{fontSize: ".8rem"}}>Aalborg</span>
                <span style={{fontSize: ".65rem"}} className="prim-btn">Request consultation</span>
            </div>
            <div style={{display:"flex", flexDirection: "row", gap: "1rem", padding: "1rem", justifyContent:"space-around", alignItems:"center"}}>
                <span style={{fontSize: ".8rem"}}>Jane Doe</span>
                <span style={{fontSize: ".8rem"}}>Copenhagen</span>
                <span style={{fontSize: ".65rem"}} className="prim-btn">Request consultation</span>
            </div>
        </div>
    </div>
}