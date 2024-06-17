import { useState } from "react";
import { foodChosen } from "../pages/TrackFoodsPage";
import { notfiyUser } from "../Notifcation";

export function FoodChoice () {
    const [ gramAmount, setGramAmount ] = useState(100)

    function logFood() {
        fetchLoggedFood({
            foodName: foodChosen.value.name,
            amount: parseFloat(gramAmount)
        })
        .then(data => {
            if (data.msg) {
                let loggedFood = foodChosen.value.name
                foodChosen.value = null
                notfiyUser(loggedFood+" was logged successfully.")
            }
            else {
                notfiyUser("Food was unable to be logged.")
            }
        })
    }

    async function fetchLoggedFood(inputData) {
        const response = await fetch(window.location.origin+'/api/log-single-food', {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(inputData)
        });
        const data = await response.json();
        return data;
    }

    return <div className="overlay-background" onClick={(e) => { if (e.target.classList.contains("overlay-background")) { foodChosen.value = null } }}>
        <div className="overlay-container">
            <div className="food-choice">
                <span className="data-origin">{foodChosen.value.dataOrigin}</span>
                <h3>{foodChosen.value.name}</h3>
                <div style={{display: "flex", flexDirection:"row", gap:"1rem", alignItems: "center"}}>
                    <input type="number" name="" id="" value={gramAmount} onChange={(e) => { setGramAmount((currentGrams) => { return e.target.value }) }} />
                    <span>grams</span>
                </div>
                <span onClick={logFood} className="prim-btn">Log food</span>
            </div>
        </div>
    </div>
}