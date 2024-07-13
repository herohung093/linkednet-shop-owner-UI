import React from "react";

interface WorkingDayRadioProps {
  formData: {
    id: number | null;
    firstName: string;
    lastName: string;
    nickname: string;
    phone: string;
    skillLevel: number | null;
    dateOfBirth: string;
    rate: number | null;
    workingDays: number[];
    storeUuid: string;
    tenantUuid: string;
    isActive: boolean;
  };
  handleWorkingDaysChange: (day: number) => void;
}

const WorkingDayRadio: React.FC<WorkingDayRadioProps> = ({
  formData,
  handleWorkingDaysChange,
}) => {
  return (
    <div className="mb-[15px] flex gap-5">
      <label className="w-[80px]  text-right text-[15px]">Working Days</label>
      <div className="inline-flex flex-1">
        <div className="flex flex-wrap justify-start gap-3 ">
          {[
            { label: "Mo", value: 1 },
            { label: "Tu", value: 2 },
            { label: "We", value: 3 },
            { label: "Th", value: 4 },
            { label: "Fr", value: 5 },
            { label: "Sa", value: 6 },
            { label: "Su", value: 7 },
          ].map((day) => (
            <label
              key={day.value}
              className={`cursor-pointer border-2 flex justify-center  rounded-md h-7 w-10  ${
                formData.workingDays.includes(day.value)
                  ? "text-white bg-blue-700 border-2 border-blue-700 font-bold"
                  : "text-white bg-slate-300 border-2 border-slate-300 "
              }`}
            >
              <input
                type="checkbox"
                name="workingDays"
                value={day.value}
                checked={formData.workingDays.includes(day.value)}
                onChange={() => handleWorkingDaysChange(day.value)}
                className="appearance-none"
              />
              <span className=" flex justify-center items-center">{day.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkingDayRadio;
