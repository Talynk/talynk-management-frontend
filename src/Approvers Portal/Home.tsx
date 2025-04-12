import Navbar from "./Navbar"
import Sidebar from "@/components/overview/sidebar"
import Cards from "../components/Cards"
import { data as originalData } from "../data"
import Pending from "@/Reusable/pending"
import Videos from '../components/overview/Videos'
import { Post } from '@/api/services/adminService'

const Home = () => {
    const limitedData = originalData.slice(0, 5);
    
    // Handler for when a post is selected from the sidebar
    const handleSelectPost = (post: Post) => {
      console.log("Selected post in Approvers Portal:", post.id);
      // Handle post selection logic here
    };
    
  return (
    <div>
        <div className="">
            <Navbar></Navbar>
        </div>
        <div className="flex justify-between px-9 ">
        <div className="">
            <div>
                <h1 className="text-2xl font">Hello, <span className="text-blue font-bold">Nyumbayire</span></h1><br />
                <h2 className="text-lg">Glad to have you on board😀</h2>
            </div>
            <div>
                <Cards data={limitedData} extraStyles="gap-7 pt-3"></Cards>
            </div>
            <div>
                <Pending></Pending>
            </div>
            <div>
                <Videos></Videos>
                <Videos></Videos>
            </div>
        </div>
        
        <div>
            <Sidebar onSelectPost={handleSelectPost}></Sidebar>
        </div>

        </div>
    </div>
  )
}

export default Home