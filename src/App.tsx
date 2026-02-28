import { useTheme } from '@/hooks/useTheme';
import { Header } from '@/components/layout';
import { Editor, Preview, SettingsPanel, ExportPanel } from '@/components/features';
import styles from './App.module.scss';

function App() {
  useTheme();

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <div className={styles.workspace}>
          <div className={styles.editorPane}>
            <Editor />
          </div>
          <div className={styles.previewPane}>
            <Preview />
            <div className={styles.exportPane}>
              <ExportPanel />
            </div>
          </div>
        </div>
        <SettingsPanel />
      </main>
      <footer className={styles.footer}>
        <span>Powered by </span>
        <a
          href="https://github.com/tool3/shellfie"
          target="_blank"
          rel="noopener noreferrer"
        >
          shellfie
        </a>
      </footer>
    </div>
  );
}

export default App;
