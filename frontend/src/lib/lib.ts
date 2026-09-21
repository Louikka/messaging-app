export function anyErrorToString(err: any): string
{
    if (err instanceof Error)
    {
        return err.message;
    }
    else
    {
        console.error('anyErrorToString() -> not an instance of Error: ', err);
        return 'error';
    }
}
