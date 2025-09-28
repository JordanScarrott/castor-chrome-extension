type PromiseSuccess<T> = { data: T; error: undefined };
type PromiseFailure<E> = { data: undefined; error: E };
export type PromiseResults<T, E = Error> =
    | PromiseSuccess<T>
    | PromiseFailure<E>;

export async function resolvePromise<T>(
    promise: () => Promise<T>
): Promise<PromiseResults<T>> {
    try {
        const data = await promise();
        return { data: data, error: undefined };
    } catch (error) {
        return { data: undefined, error: error as Error };
    }
}
