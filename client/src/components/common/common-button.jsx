import { Button } from "@/components/ui/button";

function CommonButton({ onClick, buttonText, className, type, disabled }) {
  return (
    <Button
      type={type || "submit"}
      onClick={onClick || null}
      disabled={disabled || false}
      className={`flex h-11 justify-center items-center px-5 bg-black font-extrabold text-white border-none rounded hover:bg-black hover:text-white || ${className}`}
    >
      {buttonText}
    </Button>
  );
}

export default CommonButton;
