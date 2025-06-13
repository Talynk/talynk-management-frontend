import Navigation from "./navigation"
import logo from '../assets/tLogo.png'
// import { IoNotificationsOutline } from "react-icons/io5"
import CustomButton from "../components/overview/customButton"
import { useNavigate } from "react-router-dom"

const Navbar = () => {

  const navigate = useNavigate();
  return (
    
       <header className="sticky top-0 left-0 right-0 z-50  bg-white">
  <nav className="w-full py-3 px-4 lg:px-8 pb-4">
    <div className="flex items-center justify-between">
      {/* Logo and Navigation */}
      <div className="flex items-center gap-8">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Talynk Logo" className="h-8 w-auto" />
          <h1 className="text-2xl whitespace-nowrap font-bold">
            Tal<span className="text-blue italic">ynk</span>
          </h1>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:block">
          <Navigation />
        </div>
      </div>

      {/* Notification and Buttons */}
      <div className="flex items-center gap-6">
        {/* Buttons - Desktop */}
        <div className="hidden sm:flex items-center gap-8">
          <CustomButton
            text="Go To App"
            bgColor="#006FFD"
            textColor="white"
            border="none"
            extraStyles={{ fontWeight: 600 }}
          />
        </div>

        {/* Mobile Menu Button */}
        <button className="sm:hidden p-2 rounded-md hover:bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </div>

    {/* Mobile Navigation Menu */}
    <div className="md:hidden">
      <div className="hidden pt-4 pb-3 space-y-1">
        <Navigation />
        <div className="flex flex-col gap-2 mt-4">
          <CustomButton
            text="Go To App"
            bgColor="#006FFD"
            textColor="white"
            border="none"
            extraStyles={{ fontWeight: 600 }}
          />
        </div>
      </div>
    </div>
  </nav>
 
</header>
      
   
  )
}

export default Navbar
