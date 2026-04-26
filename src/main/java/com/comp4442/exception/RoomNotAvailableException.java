package com.comp4442.exception;

/**
 * Exception thrown when a room is not available for the requested dates
 */
public class RoomNotAvailableException extends RuntimeException {
    public RoomNotAvailableException(String message) {
        super(message);
    }
}
