export default
class AltostraError extends Error {
  constructor(
    message: string,
    public readonly inner?: Error
  ) {
    super(message)
  }
}