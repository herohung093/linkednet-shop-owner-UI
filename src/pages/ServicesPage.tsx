import AddCategoryDialog from "../components/AddCategoryDialog";
import EditCategoryDialog from "../components/EditCategoryDialog";
import CustomLoading from "../components/Loading";
import isTokenExpired from "../helper/CheckTokenExpired";
import { refreshToken } from "../helper/RefreshToken";
import { getToken } from "../helper/getToken";
import { axiosWithToken } from "../utils/axios";

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

// interface Service {
//   id: number;
//   name: string;
//   description: string;
// }

interface Category {
  id: number;
  type: string;
  levelType: number;
  description: string | null;
  storeUuid: string;
  active: boolean;
  tenantUuid: string;
}

const ServicesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  // const [categoryName, setCategoryName] = useState<string>("");
  // const [serviceName, setServiceName] = useState<string>("");
  // const [serviceDescription, setServiceDescription] = useState<string>("");
  const sortedCategories = categories.sort((a, b) => a.id - b.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("authToken")) {
      const token = getToken();

      if (isTokenExpired(token)) {
        refreshToken();
      }
    } else {
      navigate("/session-expired");
    }
  }, [navigate]);

  const fetchStaffs = useCallback(async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await axiosWithToken.get<any[]>(`/serviceType/`);
      console.log(response.data);

      setCategories(response.data);
      setError(null);
    } catch (error) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs();
  }, []);

  if (loading) return <CustomLoading />;
  if (error) return <div>Error</div>;
  return (
    <div className="p-4 md:w-[80%] mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold mb-2">Type</h2>
        <AddCategoryDialog />
      </div>

      {sortedCategories?.map((category) => (
        <div key={category.id} className="mb-6 border-b-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md">{category.type}</h3>
            <div>
              <EditCategoryDialog category={category} />
            </div>
          </div>

          {/* <div className="mb-4">
            <h4 className="text-md font-bold mb-2">Add Service</h4>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="border p-2 mb-2 w-full"
              placeholder="Service Name"
            />
            <input
              type="text"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              className="border p-2 mb-2 w-full"
              placeholder="Service Description"
            />
            <button
              onClick={() => handleAddService(category.id)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Service
            </button>
          </div> */}
        </div>
      ))}
    </div>
  );
};

export default ServicesPage;
