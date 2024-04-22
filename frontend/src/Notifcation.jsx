export function notfiyUser(msg, status) {
    document.querySelectorAll(".notification").forEach(item => {item.remove()})
    let newDiv = document.createElement("div")
    newDiv.classList.add("notification")
    if (status === "success") {
        // newDiv.style.background = "white"
        // newDiv.style.color = "black"
    }
    else {
        // newDiv.style.background = "white"
        // newDiv.style.color = "black"
    }
    newDiv.innerText = msg
    document.body.append(newDiv)
    setTimeout(() => {
        newDiv.style.bottom = "-10%"
        setTimeout(() => {
            newDiv.remove()
        }, 500)
    }, 5500)
}