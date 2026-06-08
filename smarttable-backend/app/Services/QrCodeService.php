<?php

namespace App\Services;

use App\Models\TableRestaurant;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Encoder\Encoder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrCodeService
{
    private const OUTPUT_SIZE = 500;

    public function orderUrl(TableRestaurant $table): string
    {
        $base = rtrim(config('app.frontend_url', 'http://localhost:5175'), '/');

        return $base.'/order'
            .'?restaurant='.$table->restaurant_id
            .'&table='.$table->id;
    }

    /**
     * @return array{qr_code_url: string, chatbot_url: string, format: string, has_logo: bool}
     */
    public function generateForTable(TableRestaurant $table): array
    {
        $table->loadMissing('restaurant');
        $url = $this->orderUrl($table);
        $logoPath = $this->resolveLogoPath($table->restaurant?->logo);

        $this->deletePreviousQrFiles($table->id);

        if (extension_loaded('gd')) {
            return $this->generatePngWithGd($table, $url, $logoPath);
        }

        if (extension_loaded('imagick')) {
            return $this->generatePngWithImagick($table, $url, $logoPath);
        }

        return $this->generateSvg($table, $url, $logoPath);
    }

    private function generatePngWithGd(TableRestaurant $table, string $url, ?string $logoPath): array
    {
        $qrCode = Encoder::encode($url, ErrorCorrectionLevel::H());
        $matrix = $qrCode->getMatrix();
        $modules = $matrix->getWidth();
        $margin = 4;
        $modulePx = (int) floor(self::OUTPUT_SIZE / ($modules + 2 * $margin));
        $imgSize = ($modules + 2 * $margin) * $modulePx;

        $img = imagecreatetruecolor($imgSize, $imgSize);
        if ($img === false) {
            throw new \RuntimeException('Impossible de créer l\'image QR (GD).');
        }

        $white = imagecolorallocate($img, 255, 255, 255);
        $black = imagecolorallocate($img, 0, 0, 0);
        imagefill($img, 0, 0, $white);

        for ($y = 0; $y < $modules; $y++) {
            for ($x = 0; $x < $modules; $x++) {
                if ($matrix->get($x, $y) !== 1) {
                    continue;
                }
                $px = ($x + $margin) * $modulePx;
                $py = ($y + $margin) * $modulePx;
                imagefilledrectangle(
                    $img,
                    $px,
                    $py,
                    $px + $modulePx - 1,
                    $py + $modulePx - 1,
                    $black
                );
            }
        }

        $hasLogo = false;
        if ($logoPath) {
            $hasLogo = $this->overlayLogoWithGd($img, $logoPath, $imgSize);
        }

        ob_start();
        imagepng($img, null, 6);
        $png = ob_get_clean();
        imagedestroy($img);

        if ($png === false || $png === '') {
            throw new \RuntimeException('Échec export PNG (GD).');
        }

        $path = 'qrcodes/table_'.$table->id.'.png';
        Storage::disk('public')->put($path, $png);

        return $this->finish($table, $path, 'png', $url, $hasLogo);
    }

    private function overlayLogoWithGd(\GdImage $qrImage, string $logoPath, int $qrSize): bool
    {
        $logo = $this->loadGdImage($logoPath);
        if (! $logo) {
            return false;
        }

        $logoSize = (int) round($qrSize * 0.22);
        $dstX = (int) (($qrSize - $logoSize) / 2);
        $dstY = $dstX;
        $pad = max(4, (int) round($logoSize * 0.08));
        $white = imagecolorallocate($qrImage, 255, 255, 255);

        imagefilledrectangle(
            $qrImage,
            $dstX - $pad,
            $dstY - $pad,
            $dstX + $logoSize + $pad,
            $dstY + $logoSize + $pad,
            $white
        );

        imagecopyresampled(
            $qrImage,
            $logo,
            $dstX,
            $dstY,
            0,
            0,
            $logoSize,
            $logoSize,
            imagesx($logo),
            imagesy($logo)
        );

        imagedestroy($logo);

        return true;
    }

    private function loadGdImage(string $path): ?\GdImage
    {
        $info = @getimagesize($path);
        if (! $info) {
            return null;
        }

        $image = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG  => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : null,
            IMAGETYPE_GIF  => @imagecreatefromgif($path),
            default        => null,
        };

        return $image instanceof \GdImage ? $image : null;
    }

    private function generatePngWithImagick(TableRestaurant $table, string $url, ?string $logoPath): array
    {
        $builder = QrCode::format('png')
            ->size(self::OUTPUT_SIZE)
            ->errorCorrection('H')
            ->margin(2);

        if ($logoPath) {
            try {
                $builder->merge($logoPath, 0.22, true);
            } catch (\Throwable $e) {
                Log::warning('QR logo merge skipped: '.$e->getMessage());
            }
        }

        $png = $builder->generate($url);
        $path = 'qrcodes/table_'.$table->id.'.png';
        Storage::disk('public')->put($path, $png);

        return $this->finish($table, $path, 'png', $url, (bool) $logoPath);
    }

    /** SVG sans logo (évite fichiers énormes / image vide dans le navigateur). */
    private function generateSvg(TableRestaurant $table, string $url, ?string $logoPath): array
    {
        $svg = (string) QrCode::size(self::OUTPUT_SIZE)
            ->errorCorrection('H')
            ->margin(2)
            ->generate($url);

        $path = 'qrcodes/table_'.$table->id.'.svg';
        Storage::disk('public')->put($path, $svg);

        return $this->finish($table, $path, 'svg', $url, false);
    }

    private function deletePreviousQrFiles(int $tableId): void
    {
        foreach (['png', 'svg'] as $ext) {
            $file = 'qrcodes/table_'.$tableId.'.'.$ext;
            if (Storage::disk('public')->exists($file)) {
                Storage::disk('public')->delete($file);
            }
        }
    }

    /**
     * @return array{qr_code_url: string, chatbot_url: string, format: string, has_logo: bool}
     */
    private function finish(TableRestaurant $table, string $path, string $format, string $url, bool $hasLogo): array
    {
        $publicPath = '/storage/'.$path;
        $table->update(['qr_code_url' => $publicPath]);

        return [
            'qr_code_url'  => $publicPath,
            'chatbot_url'  => $url,
            'format'       => $format,
            'has_logo'     => $hasLogo,
        ];
    }

    private function resolveLogoPath(?string $logo): ?string
    {
        if (! $logo || str_starts_with($logo, 'http')) {
            return null;
        }

        $full = storage_path('app/public/'.$logo);
        if (! is_file($full)) {
            return null;
        }

        return $full;
    }
}
