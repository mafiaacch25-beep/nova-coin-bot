import { pool } from './db';
import { logger } from '../lib/logger';

const REPO_OWNER = 'mafiaacch25-beep';
const REPO_NAME = 'nova-coin-bot';
const FILE_PATH = 'data/activity-points.json';

const SYNC_INTERVAL_MS = 60 * 60 * 1000;

async function syncActivityToGitHub() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    logger.warn('GITHUB_TOKEN not set, skipping GitHub sync');
    return;
  }

  try {
    const [activityResult, usersResult] = await Promise.all([
      pool.query(
        'SELECT discord_id, username, total_points, rewarded_milestones, messages_count, reactions_count, updated_at FROM nova_activity ORDER BY total_points DESC'
      ),
      pool.query(
        'SELECT discord_id, username, gold, silver, bronze, created_at FROM nova_users ORDER BY (gold * 100 + silver * 10 + bronze) DESC'
      ),
    ]);

    const data = {
      lastSynced: new Date().toISOString(),
      activity: activityResult.rows,
      users: usersResult.rows,
    };

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    let sha: string | undefined;
    const getRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (getRes.ok) {
      const fileData = (await getRes.json()) as any;
      sha = fileData.sha;
    }

    const body: any = {
      message: `🤖 Auto-sync: activity points ${new Date().toISOString()}`,
      content,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (putRes.ok) {
      logger.info('Activity points synced to GitHub successfully');
    } else {
      const err = (await putRes.json()) as any;
      logger.error({ err }, 'Failed to sync activity to GitHub');
    }
  } catch (err) {
    logger.error({ err }, 'Error syncing activity to GitHub');
  }
}

export function startGitHubSync() {
  if (!process.env.GITHUB_TOKEN) {
    logger.warn('GITHUB_TOKEN not set, GitHub sync disabled');
    return;
  }
  logger.info('Starting GitHub activity sync (every hour)');
  syncActivityToGitHub();
  setInterval(syncActivityToGitHub, SYNC_INTERVAL_MS);
}
