import { Game as MainGame } from './scenes/Game';
import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1200,
    height: 900,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [MainGame],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
