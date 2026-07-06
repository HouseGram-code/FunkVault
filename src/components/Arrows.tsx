import { FiArrowLeft, FiArrowUp, FiArrowDown, FiArrowRight } from "./icons"

/** The four Friday Night Funkin' note arrows, in their canonical colors. */
export function Arrows({ size = 18 }: { size?: number }) {
  return (
    <>
      <FiArrowLeft className="a-l" size={size} strokeWidth={3} />
      <FiArrowUp className="a-u" size={size} strokeWidth={3} />
      <FiArrowDown className="a-d" size={size} strokeWidth={3} />
      <FiArrowRight className="a-r" size={size} strokeWidth={3} />
    </>
  )
}
