import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { All, Country, CovidService, State } from "../services/covid.service";
import { LoadingController } from "@ionic/angular";
import { BookmarkService } from "../services/bookmark.service";
import { GeoService } from "../services/geo.service";

@Component({
  selector: "app-folder",
  templateUrl: "./folder.page.html",
  styleUrls: ["./folder.page.scss"]
})
export class FolderPage implements OnInit {
  public folder: string;
  public all: All;
  public countries: Country[] = [];
  public states: State[] = [];
  public today = new Date();
  public percentRecovered: string;
  public percentDied: string;
  public percentCountryRecovered: string;
  public percentCountryDied: string;
  public percentStateRecovered: string;
  public percentStateDied: string;
  public objectKeys = Object.keys;
  countryData: any;
  regionData: any;
  bookmarks: any;
  descending: boolean = false;
  order: number;
  column: string = "country";

  constructor(
    private activatedRoute: ActivatedRoute,
    private covid: CovidService,
    private bookmarkService: BookmarkService,
    public loadingController: LoadingController,
    private geoService: GeoService
  ) {}

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get("id");
    switch (this.folder) {
      case "Dashboard":
        if (!this.all) {
          this.getAllData();
        }
        break;
      case "Countries":
        if (!this.countries || this.countries.length === 0)
          this.getCountriesData();
        this.column = "country";
        break;
      case "Regions":
        if (!this.states || this.states.length === 0) this.getStatesData();
        this.column = "state";
        break;
    }
  }

  refresh() {
    this.getAllData();
  }

  async initLocation() {
    const loading = await this.loadingController.create({
      message: "Getting Your Location Data...",
      duration: 2000
    });
    loading.present();
    try {
      const geo = await this.geoService.getLocation();
      if (geo && geo.location && geo.location.country) {
        this.countryData = await this.covid
          .country(geo.location.country)
          .toPromise();
        this.percentCountryRecovered =
          (
            ((this.countryData.recovered as any) /
              (this.countryData.cases as any)) *
            100
          ).toFixed(2) + "%";
        this.percentCountryDied =
          (
            ((this.countryData.deaths as any) /
              (this.countryData.cases as any)) *
            100
          ).toFixed(2) + "%";
      } else {
        console.log("Could not load country data");
      }
      if (geo && geo.location && geo.location.region) {
        this.covid
          .states()
          .toPromise()
          .then((states: Array<State>) => {
            states.forEach((state: State) => {
              if (state.state === geo.location.region) {
                this.regionData = state;
                this.percentStateRecovered =
                  (
                    ((this.regionData.recovered as any) /
                      (this.regionData.cases as any)) *
                    100
                  ).toFixed(2) + "%";
                this.percentStateDied =
                  (
                    ((this.regionData.deaths as any) /
                      (this.regionData.cases as any)) *
                    100
                  ).toFixed(2) + "%";
              }
            });
          });
      } else {
        console.log("Could not load region data");
      }
    } catch (error) {
      console.log("Failed to load location data");
      console.log(error);
    }
    loading.dismiss();
  }

  sort() {
    this.descending = !this.descending;
    this.order = this.descending ? 1 : -1;
  }

  addHomeCountry(c: Country) {
    this.geoService.setHomeCountry(c);
    alert("Home country updated, refresh the dashboard");
  }

  addHomeState(s: State) {
    this.geoService.setHomeState(s);
    alert("Home region updated, refresh the dashboard");
  }

  addBookmark(item: Country | State) {
    this.bookmarkService.add(item);
    alert("Bookmark has been added");
  }

  removeBookmark(item) {
    this.bookmarkService.remove(item);
  }

  async getAllData() {
    const loading = await this.loadingController.create({
      message: "Getting World Stats...",
      duration: 2000
    });
    loading.present();
    try {
      this.all = await this.covid.all().toPromise();
      this.percentRecovered =
        (((this.all.recovered as any) / (this.all.cases as any)) * 100).toFixed(
          2
        ) + "%";
      this.percentDied =
        (((this.all.deaths as any) / (this.all.cases as any)) * 100).toFixed(
          2
        ) + "%";
      this.bookmarks = this.bookmarkService.bookmarks;
      this.bookmarkService.bookmarkSub.subscribe(
        (item: any) => (this.bookmarks = this.bookmarkService.bookmarks)
      );
    } catch (error) {
      console.log("Failed to load covid data", error);
    }
    loading.dismiss();
    setTimeout(() => this.initLocation());
  }

  async getCountriesData() {
    const loading = await this.loadingController.create({
      message: "Please wait...",
      duration: 2000
    });
    loading.present();
    this.countries = await this.covid.countries().toPromise();
    loading.dismiss();
  }

  async getStatesData() {
    const loading = await this.loadingController.create({
      message: "Please wait...",
      duration: 2000
    });
    loading.present();
    this.states = await this.covid.states().toPromise();
    loading.dismiss();
  }
}
