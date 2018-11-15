import posed from "react-pose";

export const FirePose = posed.div({
  grow: {
    scaleY: 1,
    transition: {
      default: { ease: "easeOut", duration: 200 }
    }
  },
  shrink: {
    scaleY: 0.8,
    transition: {
      default: { ease: "easeOut", duration: 200 }
    }
  }
});
