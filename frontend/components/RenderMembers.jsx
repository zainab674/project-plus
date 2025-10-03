import React from "react";
import AvatarCompoment from "./AvatarCompoment";
import { getColor } from "@/utils/getRandomColor";




const RenderMembers = ({ members, className = '' }) => {

  return (
    <div className={`relative flex items-center ${className}`}>
      {members?.slice(0, 6).map((member, index) => (
        <AvatarCompoment
          key={index}
          name={member?.user?.name}
          className={`relative`}
          style={{
            transform: `translateX(-${index * 10}px)`,
            zIndex: `${(members.length - index)}`
          }}
          color={getColor(index)}
        />
      ))}
      {
        members.length > 6 &&
        <span className="-translate-x-1 text-black/80">+</span>
      }
    </div>
  );
};

export default RenderMembers;
