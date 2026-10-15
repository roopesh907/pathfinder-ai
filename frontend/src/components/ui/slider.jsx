
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}) {
  const values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn(
        "group/slider w-full touch-none select-none",
        "data-horizontal:w-full data-vertical:h-full",
        "data-disabled:cursor-not-allowed",
        className
      )}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control
        className={cn(
          "relative flex w-full items-center",
          "touch-none select-none",
          "data-horizontal:min-h-6",
          "data-vertical:h-full data-vertical:min-h-40",
          "data-vertical:w-auto data-vertical:flex-col",
          "data-disabled:opacity-50"
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-full",
            "bg-white/10 select-none",
            "data-horizontal:h-2 data-horizontal:w-full",
            "data-vertical:h-full data-vertical:w-2"
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={cn(
              "absolute rounded-full",
              "bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-400",
              "transition-colors duration-150",
              "data-horizontal:h-full data-vertical:w-full"
            )}
          />
        </SliderPrimitive.Track>

        {Array.from({ length: values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className={cn(
              "relative block size-4 shrink-0 rounded-full",
              "border-2 border-indigo-200 bg-white",
              "shadow-[0_0_0_3px_rgba(99,102,241,0.15)]",
              "transition-[box-shadow,transform,border-color]",
              "duration-150 ease-out",
              "hover:scale-110 hover:border-violet-300",
              "hover:shadow-[0_0_0_5px_rgba(139,92,246,0.18)]",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-violet-400",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
              "active:scale-95",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
