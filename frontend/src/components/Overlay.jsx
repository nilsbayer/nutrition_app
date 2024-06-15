import { overlayContent } from "../App"

export function Overlay () {
    return <div onClick={(e) => {(e.target.classList.contains("overlay-background")) ? overlayContent.value = null : "" }} className="overlay-background">
        <div className="overlay-container">
            <h3 style={{fontSize: "1.1rem"}}>{overlayContent.value.title}</h3>
            <p>
                {overlayContent.value.text}
            </p>
        </div>
    </div>
}