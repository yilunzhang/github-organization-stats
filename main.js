const { Octokit } = require("@octokit/rest");
const argv = require('yargs')
  .option('org', {
    alias: 'o',
    type: 'string',
    description: 'Organization',
  })
  .option('start', {
    alias: 's',
    type: 'string',
    description: 'Start date in format of YYYY-MM-DD. If not provided, start date will not be restricted',
  })
  .option('end', {
    alias: 'e',
    type: 'string',
    description: 'End date in format of YYYY-MM-DD. If not provided, end date will not be restricted',
  })
  .demandOption(['o'])
  .argv;

const org = argv.org;
const startDate = argv.start ? new Date(argv.start).getTime() / 1000 : 0;
const endDate = argv.end ? new Date(argv.end).getTime() / 1000 : new Date().getTime() / 1000;

const maxRetry = 10;
const retrySleep = 3000;

const authToken = process.env.AUTH_TOKEN;

const octokit = new Octokit({
  auth: authToken,
});

async function getOrgStats() {
  let stats = {
    publicRepos: 0,
    privateRepos: 0,
    contributors: [],
    commits: 0,
    additions: 0,
    deletions: 0,
  };

  let repos = await octokit.paginate(octokit.repos.listForOrg, { org });

  for (let repo of repos) {
    if (repo.fork) {
      continue
    }

    let contributorsStats;
    for (let i = 0; i < maxRetry; i++) {
      contributorsStats = await octokit.repos.getContributorsStats({
        owner: repo.owner.login,
        repo: repo.name,
      });

      if (contributorsStats.data && contributorsStats.data.length !== undefined) {
        break;
      }

      if (i == maxRetry-1) {
        throw "failed to get contributors stats";
      }

      await new Promise(resolve => setTimeout(resolve, retrySleep));
    }

    let active = false;
    for (let contributor of contributorsStats.data) {
      let contributed = false;
      for (let week of contributor.weeks) {
        if (week.w >= startDate && week.w <= endDate) {
          if (week.a > 0 || week.d > 0 || week.c > 0) {
            stats.additions += week.a;
            stats.deletions += week.d;
            stats.commits += week.c;
            contributed = true;
            active = true;
          }
        }
      }

      if (contributed && stats.contributors.indexOf(contributor.author.login) < 0) {
        stats.contributors.push(contributor.author.login);
      }
    }

    if (active) {
      if (repo.private) {
        stats.privateRepos++;
      } else {
        stats.publicRepos++;
      }
    }
  }

  stats.contributors = stats.contributors.length;

  return stats;
}

getOrgStats().then(console.log).catch(console.error);
