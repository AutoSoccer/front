import { Home } from 'lucide-react';
import styles from './page.module.css';

export default function Page() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Hello World</h1>
      <div className={styles.iconContainer}>
        <Home size={32} />
        <p>Iniciando o projeto com Next.js e Lucide Icons</p>
      </div>
    </main>
  );
}
