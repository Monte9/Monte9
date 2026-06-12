import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="article">
      <h1 className="text-2xl font-semibold mb-6">About Me</h1>
      <p>
        I&apos;m Monte Thakkar, a full-stack software engineer in Los Angeles.
        I was born and raised in Bangalore, India, and moved to San Francisco
        at 18 to study computer science — where I got hooked on building,
        attending 20+ hackathons in my junior and senior years.
      </p>
      <p>
        Out of college I joined{" "}
        <a href="https://techcrunch.com/2018/10/26/expedia-acquires-pillow-and-apartmentjet-to-conquer-the-short-term-rental-market/">
          Pillow
        </a>{" "}
        as a full-stack engineer, and a year and a half later we were acquired
        by Expedia. I stayed on through the acquisition, working on Vrbo and
        eventually relocating to Austin. A Twitter side project of mine (Flip
        McBot, an NFT sales bot) caught the attention of two startup founders,
        and I left Expedia to join their startup Curio — leading product and
        development of its Twitter and Discord bots. I followed the same
        founders to{" "}
        <a href="https://www.rosebud.app/">Rosebud</a>, the AI journaling
        startup, where I&apos;m a founding engineer today. There I&apos;ve
        helped scale the business to $1M ARR — architecting cross-platform
        subscription infrastructure processing $100K in monthly revenue and
        building an LLM-personalized push notification system that delivers
        20K+ notifications a day at an 11% open rate.
      </p>
      <p>
        I&apos;ve spent a lot of my career in the React Native ecosystem.
        I&apos;m the lead maintainer of{" "}
        <a href="https://github.com/react-native-elements/react-native-elements">
          react-native-elements
        </a>
        , the cross-platform UI toolkit (25.8k+ stars), and the author of{" "}
        <a href="https://github.com/Monte9/react-native-ratings">
          react-native-ratings
        </a>{" "}
        and other open-source components used in production by other
        people&apos;s apps.
      </p>
      <p>
        These days my nights and weekends go to agentic engineering: building
        full apps end-to-end with AI agents, each one a different shape of app
        to learn the tools and scaffolding the workflow takes — a{" "}
        <a href="https://historystories.vercel.app">
          3D museum of history stories
        </a>
        , a{" "}
        <a href="https://quizmenexus.vercel.app">trivia app graded by Claude</a>
        , an autonomous research loop, and this site itself, which is built and
        maintained by an agent harness.
      </p>
      <p>
        Away from the keyboard I&apos;m outdoorsy and play whatever sport is
        on offer — table tennis, beach volleyball, pickleball, basketball. At
        heart I&apos;m a builder and tinkerer, always hacking on new ideas.
      </p>
      <p>
        Find me on <a href="https://github.com/Monte9">GitHub</a>,{" "}
        <a href="https://x.com/montethakkar">X</a>, or{" "}
        <a href="https://www.linkedin.com/in/montethakkar/">LinkedIn</a> — or
        email me at{" "}
        <a href="mailto:manthan.thakkar@gmail.com">manthan.thakkar@gmail.com</a>
        .
      </p>
    </div>
  );
}
