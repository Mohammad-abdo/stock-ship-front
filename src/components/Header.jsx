import Navbar from "./Navbar";
import NavbarBottom from "./NavbarBottom";


export default function Header() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full ">
      <Navbar/>
      <NavbarBottom/>
    </div>
  )
}
