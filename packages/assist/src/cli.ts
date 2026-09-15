import { runAssist } from './command';

runAssist(process.argv.slice(2))
  .then((result) => {
    process.stdout.write(result + '\n');
  })
  .catch((error) => {
    // Provider errors are sanitized by the adapter; filesystem errors can contain paths.
    const message =
      error instanceof Error && !('code' in error)
        ? error.message
        : 'Could not read the supplied local file.';
    process.stderr.write(message + '\n');
    process.exitCode = 1;
  });
