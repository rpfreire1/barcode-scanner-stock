import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular';
import {ProductService} from "../core/services/product.service";
import {Product} from "../core/types/product.type";
import {FormBuilder, FormControl} from "@angular/forms";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  isSupported = false;
  barcodes: Barcode[] = [];
  scannedBarcodeValue: string = '';
  productSelected!:Product;

  productForm = this.formBuilder.group({
    productName: [{value: '', disabled: true}],
    productCode: [{value: '', disabled: true}],
    productStock: [{value: 0, disabled: true}],
    productNewStock: [0]
  });

  constructor(private formBuilder: FormBuilder,
              private alertController: AlertController,
              private productService:ProductService) {

  }

  ngOnInit() {
    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });
    this.productForm=this.formBuilder.group(
      {
        productName: new FormControl(''),
        productCode: new FormControl(''),
        productStock: new FormControl(0),
        productNewStock: new FormControl(0)

      }
    );



  }

  async scan(): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }
    const { barcodes } = await BarcodeScanner.scan();
    this.barcodes.push(...barcodes);
    this.scannedBarcodeValue = barcodes.length > 0 ? barcodes[0].rawValue : '';
    if(this.scannedBarcodeValue!=''){
      this.getProductByBarCode(this.scannedBarcodeValue);
    }
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }
  onFilterBoxChanged(){
    this.getProductByBarCode(this.scannedBarcodeValue);
  }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant camera permission to use the barcode scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }
  getProductByBarCode(barcode:string){
    this.productService.getProductByBarCode(barcode).subscribe(product=>{
      if (product){
        this.productSelected=product;
        this.productForm.patchValue(
          {
            productName: this.productSelected.nameProduct,
            productCode: this.productSelected.barCodeProduct,
            productStock: this.productSelected.stockProduct,
            productNewStock: 0
          }
        )
        this.productForm.get('productName')?.disable();
        this.productForm.get('productCode')?.disable();
        this.productForm.get('productStock')?.disable();


      }

    })
  }

  async saveNewStock(){
    if(this.productForm.value.productNewStock){
      const newStock=this.productForm.value.productNewStock;
      this.productService.updateProductStockByCode(this.scannedBarcodeValue,newStock).subscribe(
        product=>{
          console.log(product);
        }
      )
    }

  }


}
