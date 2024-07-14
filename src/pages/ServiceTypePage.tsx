import AddCategoryDialog from "../components/AddCategoryDialog";
import EditCategoryDialog from "../components/EditCategoryDialog";
import CustomLoading from "../components/Loading";
import isTokenExpired from "../helper/CheckTokenExpired";
import { refreshToken } from "../helper/RefreshToken";
import { getToken } from "../helper/getToken";
import { axiosWithToken } from "../utils/axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";

interface ServiceType {
  id: number;
  type: string;
  levelType: number;
  description: string | null;
  storeUuid: string;
  active: boolean;
  tenantUuid: string;
}

const ServiceTypePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const [serviceType, setServiceType] = useState<ServiceType[]>([]);
  const sortedServiceType = serviceType.sort((a, b) => a.id - b.id);
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

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get<ServiceType[]>(`/serviceType/`);
      console.log(response.data);

      setServiceType(response.data);
      setError(null);
    } catch (error) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, updateTrigger]);

  if (loading) return <CustomLoading />;
  if (error) return <div>Error</div>;

  const handleUpdate = () => {
    setUpdateTrigger(!updateTrigger);
  };

  return (
    <div className="p-4 md:w-[80%] mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold mb-2">Type</h2>

        <AddCategoryDialog onUpdate={handleUpdate} />
      </div>

      {sortedServiceType.map((serviceType) => (
        <div key={serviceType.id} className="mb-6 border-b-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md">{serviceType.type}</h3>
            <div className="flex gap-5">
              <ArrowDropDownCircleIcon className="cursor-pointer"/>
              <EditCategoryDialog
                serviceType={serviceType}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceTypePage;
