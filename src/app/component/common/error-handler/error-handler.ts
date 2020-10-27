import { ErrorHandler, Injectable} from '@angular/core';
@Injectable()
export class GErrorHandler implements ErrorHandler {
  constructor() { }
  handleError(error) {
     console.log('Global Error');
     // IMPORTANT: Rethrow the error otherwise it gets swallowed
     throw error;
  }
  
}