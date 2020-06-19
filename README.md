# github-organization-stats

Get github organization statistics (number of active public/private repos,
contributors, commits, additions, deletions) in a period.

## Usage

```shell
AUTH_TOKEN=<access-token> node main.js --org <organization> --start <yyyy-mm-dd> --end <yyyy-mm-dd>
```

To get activity in private repos, the token needs to have `repo` and `read:org`
permissions and belongs to an account that has view access to organization
private repos.

Access token can be omitted if only public repo stats is needed. However, github
has a very low API rate limit without access token, so very likely you will need
to provide a token.

Both start date and end date can be omitted so start/end date will not be
restricted.
