import Image from 'next/image';
import Link from 'next/link';
import styles from './bladder-installation.module.css';

const INSTALL_STEPS = [
  {
    image: '/assets/bladder-install/6478.jpg',
    title: 'Open the shell wide',
    body: 'Unzip or open the shell so the inside is easy to reach. Keep the black side walls lifted enough that the bladder can slide in without catching.',
  },
  {
    image: '/assets/bladder-install/6475.jpg',
    title: 'Lay the bladder down the center',
    body: 'Feed the bladder straight through the middle of the shell. The bladder should stay flat, with the long seams running in the same direction as the shell.',
  },
  {
    image: '/assets/bladder-install/6474.jpg',
    title: 'Move it into position',
    body: 'Work from the center toward the far end. Two people can pull and guide the bladder so it moves evenly instead of bunching on one side.',
  },
  {
    image: '/assets/bladder-install/6473.jpg',
    title: 'Smooth the roll',
    body: 'As the bladder comes forward, flatten wrinkles and keep the folded edges from twisting. Do not drag a hard crease into the shell.',
  },
  {
    image: '/assets/bladder-install/6477.jpg',
    title: 'Check the side pockets',
    body: 'Look down each side of the shell and make sure the bladder edge is sitting inside the shell cavity, not folded back over itself.',
  },
  {
    image: '/assets/bladder-install/6479.jpg',
    title: 'Finish with a full-length check',
    body: 'Before closing the shell, walk the full length and look for pinches, twists, sharp folds, or places where the bladder is trapped under the shell edge.',
  },
];

const CHECKLIST = [
  'Shell is clean and free of sticks, grit, screws, and sharp debris.',
  'Bladder is centered from end to end.',
  'No hard folds, twists, or pinched corners are trapped inside.',
  'Side edges sit inside the shell cavity on both sides.',
  'All closure areas are clear before zipping or fastening the shell.',
];

export default function BladderInstallationPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMedia}>
          <Image
            src="/assets/bladder-install/6475.jpg"
            alt="Gray Water Blob bladder being guided into the orange and black shell"
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Customer Help</p>
          <h1>Installing the bladder inside the shell</h1>
          <p>
            The Water Blob has two main parts: the outer shell and the inner
            bladder. Use this guide to keep the bladder straight, centered, and
            free of pinches before the shell is closed.
          </p>
          <a href="#steps" className={styles.heroButton}>
            Start the steps
          </a>
        </div>
      </section>

      <section className={styles.intro}>
        <div className={styles.introText}>
          <p className={styles.eyebrow}>Before You Start</p>
          <h2>Go slow and keep the bladder flat.</h2>
          <p>
            Most installation problems come from rushing the bladder into the
            shell and trapping a twist or fold. If something feels tight, back
            up, smooth it out, and then keep going.
          </p>
        </div>
        <div className={styles.callout}>
          <h3>Best with two people</h3>
          <p>
            One person should guide the bladder from inside the shell while the
            other feeds and straightens it from the opening.
          </p>
        </div>
      </section>

      <section id="steps" className={styles.steps} aria-labelledby="steps-heading">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Step By Step</p>
          <h2 id="steps-heading">Put the bladder in the right damn place.</h2>
        </div>

        <ol className={styles.stepList}>
          {INSTALL_STEPS.map((step, index) => (
            <li key={step.image} className={styles.stepCard}>
              <div className={styles.stepImageWrap}>
                <Image
                  src={step.image}
                  alt={`${step.title} during Water Blob bladder installation`}
                  width={4000}
                  height={2252}
                  sizes="(max-width: 760px) 100vw, 48vw"
                  className={styles.stepImage}
                />
              </div>
              <div className={styles.stepCopy}>
                <span className={styles.stepNumber}>Step {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.checkSection} aria-labelledby="check-heading">
        <div>
          <p className={styles.eyebrow}>Final Check</p>
          <h2 id="check-heading">Before closing the shell</h2>
          <p>
            Do this last pass before fastening anything. Fixing a fold now is
            easy; finding it after inflation is a pain.
          </p>
        </div>
        <ul className={styles.checklist}>
          {CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.support}>
        <h2>Need us to look at your setup?</h2>
        <p>
          Send photos before you close the shell if you are unsure. We can help
          confirm the bladder is sitting correctly.
        </p>
        <div className={styles.supportActions}>
          <a href="tel:+14178648461">Call (417) 864-8461</a>
          <Link href="/contact">Contact Water Blob</Link>
        </div>
      </section>
    </main>
  );
}
