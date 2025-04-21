import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const pending = () => {
  const [filter, setFilter] = useState("Current");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleFilterChange = (option: string) => {
    setFilter(option);
    setIsDropdownOpen(false);
  };
  return (
    <div>
      <div className="flex  justify-between pt-4 px-4">
        <h1 className="text-grey font-bold text-xl">Pending Videos</h1>

        <div className=" relative z-50">
          <div
            className="flex items-center  gap-2 p-2 rounded-xl border-2 border-grey cursor-pointer bg-white"
            onClick={toggleDropdown}
          >
            <span className="text-gray-600 font-medium">
              Filter by: {filter}
            </span>
            {isDropdownOpen ? (
              <FiChevronUp size={20} className="text-blue-500" />
            ) : (
              <FiChevronDown size={20} className="text-blue-500" />
            )}
          </div>

          {/* Dropdown Menu with increased z-index */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[150px] bg-white border rounded-md shadow-lg ">
              {["Newest", "Oldest", "Current"].map((option) => (
                <div
                  key={option}
                  className={`px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer ${
                    filter === option ? "font-bold text-blue-500" : ""
                  }`}
                  onClick={() => handleFilterChange(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default pending;
