import SpaceBarrageGame from './game/SpaceBarrageGame';
import { GithubAttribution } from './GithubAttribution';
import './game/space-barrage.css';

export default function App() {
  return (
    <div className="space-barrage-page">
      <SpaceBarrageGame />
      <GithubAttribution />
    </div>
  );
}
