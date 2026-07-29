export default function GradientBg() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#fdf2ec] pointer-events-none">
      <div className="absolute top-[-5%] left-[-15%] w-[55%] h-[50%] rounded-full bg-[#e8673c] opacity-60 blur-[80px]" />
      <div className="absolute top-[5%] right-[-5%] w-[50%] h-[45%] rounded-full bg-[#f0a470] opacity-50 blur-[90px]" />
      <div className="absolute top-[15%] left-[15%] w-[35%] h-[35%] rounded-full bg-[#f5c891] opacity-40 blur-[70px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[55%] h-[50%] rounded-full bg-[#d5a8e0] opacity-70 blur-[70px]" />
      <div className="absolute bottom-[-5%] left-[25%] w-[50%] h-[45%] rounded-full bg-[#f75e7a] opacity-65 blur-[60px]" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[#f2567a] opacity-60 blur-[70px]" />
      <div className="absolute bottom-[15%] right-[10%] w-[40%] h-[35%] rounded-full bg-[#5eb3f0] opacity-35 blur-[80px]" />
      <div className="absolute top-[40%] left-[20%] w-[60%] h-[30%] rounded-full bg-[#f8917a] opacity-45 blur-[80px]" />
    </div>
  );
}
