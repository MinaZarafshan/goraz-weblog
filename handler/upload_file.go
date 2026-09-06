package handler

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

var (
	ErrImageTooLarge    = errors.New("image is too large")
	ErrEmptyImage       = errors.New("image is empty")
	ErrInvalidImageType = errors.New("invalid image type")
	ErrImageOpen        = errors.New("failed to open uploaded image")
	ErrImageRead        = errors.New("failed to read uploaded image")
	ErrImageSeek        = errors.New("failed to reset image")
	ErrImageSave        = errors.New("failed to save image")
)

func saveUploadedImage(file *multipart.FileHeader) (string, string, error) {
	const maxImageSize = 5 * 1024 * 1024

	if file.Size > maxImageSize {
		return "", "", ErrImageTooLarge
	}

	if file.Size <= 0 {
		return "", "", ErrEmptyImage
	}

	src, err := file.Open()
	if err != nil {
		return "", "", ErrImageOpen
	}
	defer src.Close()

	buffer := make([]byte, 512)

	n, err := src.Read(buffer)
	if err != nil && err != io.EOF {
		return "", "", ErrImageRead
	}

	if n == 0 {
		return "", "", ErrEmptyImage
	}

	contentType := http.DetectContentType(buffer[:n])

	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}

	if !allowedTypes[contentType] {
		return "", "", ErrInvalidImageType
	}

	_, err = src.Seek(0, io.SeekStart)
	if err != nil {
		return "", "", ErrImageSeek
	}

	var ext string

	switch contentType {
	case "image/jpeg":
		ext = ".jpg"

	case "image/png":
		ext = ".png"

	case "image/webp":
		ext = ".webp"
	}

	filename := fmt.Sprintf(
		"%d%s",
		time.Now().UnixNano(),
		ext,
	)

	savePath := filepath.Join("uploads", filename)

	dst, err := os.Create(savePath)
	if err != nil {
		return "", "", ErrImageSave
	}

	_, err = io.Copy(dst, src)
	if err != nil {
		dst.Close()
		os.Remove(savePath)

		return "", "", ErrImageSave
	}

	if err := dst.Close(); err != nil {
		os.Remove(savePath)

		return "", "", ErrImageSave
	}

	imagePath := "/uploads/" + filename

	return imagePath, savePath, nil
}
