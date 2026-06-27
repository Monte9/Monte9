import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="article">
      <h1 className="mb-6 hidden text-2xl font-semibold sm:block">About Me</h1>
      <p>
        I&apos;m Monte Thakkar — curious, growth-minded, and driven. I&apos;m a
        product engineer with expertise in early-stage full-stack product
        engineering, and I live in Los Angeles with my wife, Suvarcha. I was
        born and raised in Bangalore, India, and moved to San Francisco at 18
        to study computer science at SF State — where I got hooked on
        building, attending 20+ hackathons in my junior and senior years.
        Around that time I also created and taught{" "}
        <a href="https://github.com/mobilespace/Season2">MobileSpace</a>, a
        free, in-person course that taught students mobile development (iOS,
        then React Native) to fill a gap in the CS curriculum.
      </p>

      <p>
        <a href="/resume.pdf">Download my résumé (PDF) →</a>
      </p>
      <p>
        My first job out of college was at{" "}
        <a href="https://techcrunch.com/2018/10/26/expedia-acquires-pillow-and-apartmentjet-to-conquer-the-short-term-rental-market/">
          Pillow
        </a>
        , a short-term rental startup, where I led a team of four building our
        mobile app in React Native — until Expedia acquired us in 2018. I
        stayed on at Expedia Group as a Senior Software Engineer through 2022,
        leading development of the Vrbo Owner iOS app (300K+ monthly active
        users) and spearheading React Native adoption that boosted development
        velocity by 50%. A Twitter side project of mine —{" "}
        <a href="https://twitter.com/nftsalesbot">Flip McBot</a>, an NFT sales
        bot I grew to 25k+ followers — then pulled me into web3: I joined
        Curio, the NFT analytics startup, leading product and development of
        its Twitter and Discord bots.
      </p>
      <p>
        Today I&apos;m a founding engineer at{" "}
        <a href="https://www.rosebud.app/">Rosebud</a>, the #1 AI-powered
        journal for mental health and personal growth, which I&apos;m building
        alongside Chrys Bader and Sean Dadashi. I&apos;ve helped scale the
        business from 0 to $1M ARR — architecting subscription infrastructure
        that processes $100K in monthly revenue across web and mobile, and
        building a notification system that delivers 20K+ personalized
        notifications a day. All told, I&apos;ve shipped products to over a
        million users worldwide.
      </p>
      <p>
        I&apos;ve spent a lot of my career in the React Native ecosystem.
        I&apos;m the lead maintainer of{" "}
        <a href="https://github.com/react-native-elements/react-native-elements">
          react-native-elements
        </a>
        , the cross-platform UI toolkit (25.8k+ stars, 400K+ monthly
        downloads), and the author of{" "}
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

      <h2>Key beliefs</h2>
      <ul>
        <li>Have strong opinions, weakly held</li>
        <li>Have a high standard of success and a high tolerance for failure</li>
        <li>
          Being aware of internal vs external validation is key to personal
          growth
        </li>
        <li>Who you work with is more important than what you work on</li>
        <li>Life is probabilistic, not deterministic</li>
      </ul>

      <p>
        Away from the keyboard I&apos;m outdoorsy and play whatever sport is on
        offer — table tennis, beach volleyball, pickleball, basketball.
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
