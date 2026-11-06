import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { TrainingIllustration } from "./TrainingIllustration";
export function AuthStory() {
  return (
    <section className="auth-story" aria-label="Welcome to Forge">
      <div className="story-top">
        <span className="story-label">
          <Sparkles size={14} />
          YOUR NEXT CHAPTER STARTS HERE
        </span>
        <span className="story-arrow">
          <ArrowUpRight size={27} />
        </span>
      </div>
      <h1>
        A little stronger.
        <br />A little <span>more you.</span>
      </h1>
      <p>
        A home for your lifts, your little wins, and the progress you make along
        the way.
      </p>
      <div className="auth-illustration">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <TrainingIllustration />
        <span className="floating-label">
          <span className="mini-icon">
            <Check size={15} />
          </span>
          Every rep is a fresh start.
        </span>
      </div>
      <div className="story-bottom">
        <span>SHOW UP FOR YOURSELF.</span>
        <span>WE’LL KEEP TRACK. ↗</span>
      </div>
    </section>
  );
}
