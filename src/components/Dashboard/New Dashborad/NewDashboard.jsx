import TopSumarry from './TopSumarry';
import './NewDashboard.scss';
// import DoughnutChart from './DoughnutChart';
// import ImageSlider from './ImageSlider';
import UnpaidTenantsView from './UnpaidTenantsView/UnpaidTenantsView';
import UnpaidTenantsList from './UnpaidTenantsList/UnpaidTenantsList';

function NewDashboard() {
  return (
    <div className="NewDashboard">
      <TopSumarry />
      <div className="sum">
        {/* <DoughnutChart /> */}

        <UnpaidTenantsView />
        {/* <ImageSlider /> */}
        <UnpaidTenantsList />
      </div>
    </div>
  );
}

export default NewDashboard;
